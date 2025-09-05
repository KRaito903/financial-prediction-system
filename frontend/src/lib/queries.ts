import { gql } from "@apollo/client";

export const LOGIN_QUERY = gql`
	query Login($email: String!, $password: String!) {
		login(email: $email, password: $password) {
			success
			message
			user {
				id
				email
				createdAt
				updatedAt
			}
		}
	}
`;

export const SIGNUP_MUTATION = gql`
	mutation Signup(
		$email: String!
		$password: String!
	) {
		signup(
			email: $email
			password: $password
		) {
			success
			message
			user {
				id
				email
				createdAt
				updatedAt
			}
		}
	}
`;

export const FETCH_TRADING_PAIRS = gql`
	query FetchTradingPairs {
		fetchCoinList {
			coins
		}
	}
`;

export const FETCH_BACKTEST_HISTORY = gql`
    query FetchBacktestHistory($input: HistoricalDataInput!) {
        fetchBacktestHistory(input: $input) {
            id
            symbol
            status
            strategy {
                fastMaPeriod
                slowMaPeriod
            }
            profitFactor
            totalTrades
            winningTrades
            losingTrades
            metrics {
                totalReturn
                sharpeRatio
                maxDrawdown
                winRate
            }
            data {
                Date
                portfolioValue
								signal
            }
            createdAt
            updatedAt
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
			profitFactor
			totalTrades
			winningTrades
			losingTrades
			metrics {
				totalReturn
				sharpeRatio
				maxDrawdown
				winRate
			}
			data {
				Date
				portfolioValue
				signal
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
			profitFactor
			totalTrades
			winningTrades
			losingTrades
			metrics {
				totalReturn
				sharpeRatio
				maxDrawdown
				winRate
			}
			data {
				Date
				portfolioValue
			}
		}
	}
`;

export const RUN_ML_BACKTEST = gql`
  mutation RunMlBacktest($input: BacktestInput!) {
    runMlBacktest(input: $input) {
      status
      profitFactor
      totalTrades
      winningTrades
      losingTrades
      metrics {
        totalReturn
        sharpeRatio
        maxDrawdown
        winRate
      }
      data {
        Date
        portfolioValue
        signal
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

export const GET_NEWS = gql`
  query GetNews($limit: Int!) {
    news(limit: $limit) {
      id
      title
      text
      url
      publishedTime
      sentimentScore
    }
  }
`;