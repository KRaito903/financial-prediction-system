import { gql } from "@apollo/client";

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
	mutation Signup(
		$username: String!
		$password: String!
		$name: String!
		$email: String!
	) {
		signup(
			username: $username
			password: $password
			name: $name
			email: $email
		) {
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