export interface BusLine {
    origin: string,
    destination: string,
    service_code: string,
    line_name: string,
    stops: number[][] // dim: n x 2
}