import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoggerService } from '@core/service';
import { Observable, catchError, delay, finalize, map, mergeMap, of, retry, tap } from 'rxjs';

// 1 request
// x-rate-limit-ip: 12:4:10,16:12:300
// x-rate-limit-ip-state: 1:4:0,1:12:0
// x-rate-limit-policy: trade-fetch-request-limit
// x-rate-limit-rules: Ip

// 2 request
// x-rate-limit-ip: 12:4:10,16:12:300
// x-rate-limit-ip-state: 2:4:0,2:12:0
// x-rate-limit-policy: trade-fetch-request-limit
// x-rate-limit-rules: Ip

// 3 request
// x-rate-limit-ip: 12:4:10,16:12:300
// x-rate-limit-ip-state: 3:4:0,3:12:0
// x-rate-limit-policy: trade-fetch-request-limit
// x-rate-limit-rules: Ip

// reached
// x-rate-limit-ip: 12:4:10,16:12:300
// x-rate-limit-ip-state: 7:4:0,17:12:0
// x-rate-limit-policy: trade-fetch-request-limit
// x-rate-limit-rules: Ip

// after reached
// x-rate-limit-ip: 12:4:10,16:12:300
// x-rate-limit-ip-state: 4:4:0,4:12:218
// x-rate-limit-policy: trade-fetch-request-limit
// x-rate-limit-rules: Ip

const HEADER_RULE = `x-rate-limit`;
const HEADER_RULE_SEPARATOR = `,`;
const HEADER_RULE_VALUE_SEPARATOR = `:`;
const HEADER_RULE_STATE = `state`;
const HEADER_RULES = `x-rate-limit-rules`;

const RULE_FRESH_DURATION = 1000 * 10;

const WAITING_RETRY_DELAY = 1000;
const WAITING_RETRY_COUNT = 10;

interface TradeRateLimitRule {
	count: number;
	period: number;
	limited: number;
}

interface TradeRateLimitRequest {
	finished?: number;
}

interface TradeRateLimit {
	requests: TradeRateLimitRequest[];
	rules?: TradeRateLimitRule[];
	update?: number;
}

enum TradeRateThrottle {
	None = 1,
	NoRules = 2,
	Stale = 3,
	Reached = 4,
	Limited = 5,
}

const LogTag = 'rateLimiter';

@Injectable({
	providedIn: 'root',
})
export class TradeRateLimitService {
	private readonly limits: Record<string, TradeRateLimit> = {};

	constructor(
		private readonly logger: LoggerService,
	) {
	}

	public throttle<TResult>(
		resource: string,
		getRequest: () => Observable<HttpResponse<TResult>>
	): Observable<TResult> {
		return of(resource).pipe(
			map((resource) => this.shouldThrottle(resource)),
			tap((reason) => {
				this.logger.debug(LogTag, `resource '${resource}' throttle state '${TradeRateThrottle[reason]}'`);
				switch (reason) {
					case TradeRateThrottle.Limited:
						throw 'limited';
					case TradeRateThrottle.NoRules:
					case TradeRateThrottle.Reached:
					case TradeRateThrottle.Stale:
						throw 'waiting';
				}
			}),
			mergeMap(() => {
				const request = this.createRequest(resource);
				return getRequest().pipe(
					map((response) => {
						this.updateRules(resource, response);
						this.filterRequests(resource);
						if (!response.body) {
							throw 'waiting';// This'll forcefully retry the request
						}
						return response.body as TResult;
					}),
					finalize(() => request.finished = Date.now()),
					catchError((response) => {
						if (response.status === 429) {
							this.updateRules(resource, response);
						}
						this.filterRequests(resource);
						throw response;
					}),
				);
			}),
			retry({
				delay: (error, count) => {
					if (error === 'limited') {
						throw new HttpErrorResponse({ status: 429 });
					} else if (error === 'waiting') {
						if (count >= WAITING_RETRY_COUNT) {
							throw new HttpErrorResponse({ status: 429 });
						}
						return of(error).pipe(delay(WAITING_RETRY_DELAY));
					}
					throw error;
				}
			})
		);
	}

	private shouldThrottle(resource: string): TradeRateThrottle {
		const { rules, requests, update } = this.getLimit(resource);

		const inflight = requests.some((request) => !request.finished);
		if (!rules || !update) {
			if (!inflight) {
				// allow a new request to gather rules
				return TradeRateThrottle.None;
			}
			// request made for gathering rules
			// do not allow any further requests
			return TradeRateThrottle.NoRules;
		}

		const now = Date.now();
		if (inflight && now - update > RULE_FRESH_DURATION) {
			// a request was made and data is stale
			// wait for request to be finished before allowing further requests
			return TradeRateThrottle.Stale;
		}

		// only allow a new request if no rule is limited
		const limited = rules.some((rule) => rule.limited > 0 && rule.limited > now);
		if (limited) {
			return TradeRateThrottle.Limited;
		}

		const reached = rules.some((rule) => {
			// all requests which were made in the period count
			const limit = now - rule.period * 1000;
			const limiting = requests.filter((request) => {
				if (!request.finished) {
					return true;
				}
				return request.finished >= limit;
			});
			return limiting.length >= rule.count;
		});
		if (reached) {
			return TradeRateThrottle.Reached;
		}
		return TradeRateThrottle.None;
	}

	private createRequest(resource: string): TradeRateLimitRequest {
		const limit = this.getLimit(resource);
		const request: TradeRateLimitRequest = {};
		limit.requests.push(request);
		return request;
	}

	private filterRequests(resource: string): void {
		const limit = this.getLimit(resource);

		const { rules, requests } = limit;
		if (!rules) {
			return;
		}

		const now = Date.now();
		limit.requests = requests.filter((request) => {
			if (!request.finished) {
				return true;
			}
			return rules.some((rule) => {
				if (!request.finished) {
					return true;
				}
				const min = now - rule.period * 1000;
				return request.finished >= min;
			});
		});
	}

	private updateRules(resource: string, response: HttpResponse<unknown>): void {
		const current = this.getLimit(resource);

		const rules = response?.headers?.get(HEADER_RULES);
		if (!rules) {
			current.rules = undefined;
			return;
		}

		const headers = response.headers;

		const now = Date.now();

		current.update = now;
		current.rules = rules
			.toLowerCase()
			.split(HEADER_RULE_SEPARATOR)
			.map((name) => name.trim())
			.map((name) => {
				const limits = headers.get(`${HEADER_RULE}-${name}`)?.split(HEADER_RULE_SEPARATOR) || [];
				const states = headers.get(`${HEADER_RULE}-${name}-${HEADER_RULE_STATE}`)?.split(HEADER_RULE_SEPARATOR) || [];
				if (limits.length !== states.length) {
					return undefined;
				}

				return limits.map((_, index) => {
					const [count, period, timeoff] = limits[index]
						.split(HEADER_RULE_VALUE_SEPARATOR)
						.map((x) => +x);
					const [currentCount, , currentTimeoff] = states[index]
						.split(HEADER_RULE_VALUE_SEPARATOR)
						.map((x) => +x);

					let limited = currentTimeoff;
					if (limited <= 0 && currentCount > count) {
						limited = timeoff;
					}

					const rule: TradeRateLimitRule = {
						count,
						period,
						limited: limited > 0 ? now + limited * 1000 : 0,
					};

					if (rule.limited === 0) {
						const limit = now - rule.period * 1000;
						const limiting = current.requests.filter((request) => {
							if (!request.finished) {
								return true;
							}
							return request.finished >= limit;
						});

						let missing = currentCount - limiting.length;
						while (missing > 0) {
							current.requests.push({
								finished: now,
							});
							--missing;
						}
					}
					return rule;
				});
			})
			.filter((rules) => rules !== undefined)
			.reduce((a, b) => a!.concat(b!), []);
	}

	private getLimit(resource: string): TradeRateLimit {
		if (!this.limits[resource]) {
			this.limits[resource] = {
				requests: [],
				rules: undefined,
				update: undefined,
			};
		}
		return this.limits[resource];
	}
}
