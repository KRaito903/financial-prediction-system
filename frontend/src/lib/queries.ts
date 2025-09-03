import { gql } from '@apollo/client';

export const LOGIN_QUERY = gql`
  query Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      success
      message
      user {
        id
        username
        name
        email
      }
    }
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation Signup($username: String!, $password: String!, $name: String!, $email: String!) {
    signup(username: $username, password: $password, name: $name, email: $email) {
      success
      message
      user {
        id
        username
        name
        email
      }
    }
  }
`;

export const GET_LATEST_KLINES = gql`
  query GetLatestKlines($symbol: String!, $interval: KlineInterval!, $limit: Int) {
    getLatestKlines(symbol: $symbol, interval: $interval, limit: $limit) {
      data {
        openTime
        open
        high
        low
        close
        volume
        closeTime
        symbol
        interval
      }
      count
      symbol
      interval
    }
  }
`;

export const GET_HISTORICAL_KLINES = gql`
  query GetHistoricalKlines(
    $symbol: String!
    $interval: KlineInterval!
    $startTime: Float
    $endTime: Float
    $limit: Int
  ) {
    getHistoricalKlines(
      symbol: $symbol
      interval: $interval
      startTime: $startTime
      endTime: $endTime
      limit: $limit
    ) {
      data {
        openTime
        open
        high
        low
        close
        volume
        closeTime
        symbol
        interval
      }
      count
    }
  }
`;