export interface RpcError {
  status: number;
  message: string;
  details: string | Record<string, any>;
}
