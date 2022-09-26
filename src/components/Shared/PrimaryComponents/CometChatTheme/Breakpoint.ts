import { values,keys } from "./values";
export class Breakpoints {
	values:values = {
		xs: 0,
		sm: 600,
		md: 900,
		lg: 1200,
		xl: 1536,
	};
	/**
	 * @param  {values} values
	 */
	setValues (values:values) {
		this.values = values;
	}
	/**
	 * @param  {keys} key
	 */
	up(key:keys) {
		return `@media (min-width:${(this.values as any)[key] - 0.5}px)`;
	}
	/**
	 * @param  {keys} key
	 */
	down(key:keys) {
		return `@media (max-width:${(this.values as any)[key] - 0.5}px)`;
	}
	/**
	 * @param  {keys} keyA
	 * @param  {keys} keyB
	 */
	between(keyA:keys, keyB:keys) {
		return `@media (min-width:${(this.values as any)[keyA]}px) and (max-width:${(this.values as any)[keyB] - 0.5}px)`;
	}
}