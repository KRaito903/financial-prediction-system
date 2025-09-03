import { InfluxDBConfig } from '../datasources/influxdb-api';

export function getInfluxDBConfig(): InfluxDBConfig {
  return {
    url: process.env.INFLUXDB_URL || 'http://influxdb2:8086',
    token: process.env.INFLUXDB_TOKEN || 'MyInitialAdminToken0==',
    org: process.env.INFLUXDB_ORG || 'docs',
    bucket: process.env.INFLUXDB_BUCKET || 'home'
  };
}

export function validateInfluxDBConfig(): boolean {
  const config = getInfluxDBConfig();
  
  const requiredFields = ['url', 'token', 'org', 'bucket'];
  const missingFields = requiredFields.filter(field => !config[field as keyof InfluxDBConfig]);
  
  if (missingFields.length > 0) {
    console.warn(`⚠️ Missing InfluxDB configuration: ${missingFields.join(', ')}`);
    console.warn('InfluxDB caching will be disabled');
    return false;
  }
  
  return true;
}