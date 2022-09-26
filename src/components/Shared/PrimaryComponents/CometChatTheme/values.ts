export enum keys {
    xs,
    sm,
    md,
    lg,
    xl,
}
export interface modes{
    light?:string
    dark?:string
}
export interface font{
        fontFamily?: string,
		fontWeight?: string,
		fontSize?: string,
}
export interface values  {
    xs?: number,
    sm?: number,
    md?: number,
    lg?: number,
    xl?: number,
};
