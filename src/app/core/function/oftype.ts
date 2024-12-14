export function ofType<T>(o: T | unknown): o is T {
	if (o && Object.keys(o).length > 0) {
		return true;
	}
	return false;
}
