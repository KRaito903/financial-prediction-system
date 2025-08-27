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

export const RUN_VECTORIZED_BACKTEST = gql`
  mutation RunVectorizedBacktest($input: BacktestInput!) {
    runVectorizedBacktest(input: $input) {
      status
      strategy {
        fastMaPeriod
        slowMaPeriod
      }
      data {
        Date
        portfolioValue
      }
      metrics {
        totalReturn
        sharpeRatio
        maxDrawdown
        winRate
        profitFactor
        totalTrades
        winningTrades
        losingTrades
      }
    }
  }
`;

export const RUN_EVENT_DRIVEN_BACKTEST = gql`
  mutation RunEventDrivenBacktest($input: BacktestInput!) {
    runEventDrivenBacktest(input: $input) {
      status
      strategy {
        fastMaPeriod
        slowMaPeriod
      }
      data {
        Date
        portfolioValue
      }
      metrics {
        totalReturn
        sharpeRatio
        maxDrawdown
        winRate
        profitFactor
        totalTrades
        winningTrades
        losingTrades
      }
    }
  }
`;