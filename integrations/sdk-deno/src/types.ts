export interface TelescopeOptions {
  /** ID of the integration */
  integrationId: string;
  /** Integration Client ID */
  clientId: string;
  /** Integration Client Secret */
  clientSecret: string;
  /** Integration key */
  key: string;

  /** URL of the telescope backend. Only meant for development */
  baseUrl?: string;
}
