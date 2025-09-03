import { GraphQLResolveInfo } from 'graphql';
import { DataSourceContext } from './context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Kline = {
  __typename?: 'Kline';
  close: Scalars['String']['output'];
  closeTime: Scalars['Float']['output'];
  high: Scalars['String']['output'];
  interval: Scalars['String']['output'];
  low: Scalars['String']['output'];
  open: Scalars['String']['output'];
  openTime: Scalars['Float']['output'];
  quoteAssetVolume: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
  takerBuyBaseAssetVolume: Scalars['String']['output'];
  takerBuyQuoteAssetVolume: Scalars['String']['output'];
  trades: Scalars['Int']['output'];
  volume: Scalars['String']['output'];
};

export enum KlineInterval {
  EightHours = 'EIGHT_HOURS',
  FifteenMinutes = 'FIFTEEN_MINUTES',
  FiveMinutes = 'FIVE_MINUTES',
  FourHours = 'FOUR_HOURS',
  OneDay = 'ONE_DAY',
  OneHour = 'ONE_HOUR',
  OneMinute = 'ONE_MINUTE',
  OneMonth = 'ONE_MONTH',
  OneSecond = 'ONE_SECOND',
  OneWeek = 'ONE_WEEK',
  SixHours = 'SIX_HOURS',
  ThirtyMinutes = 'THIRTY_MINUTES',
  ThreeDays = 'THREE_DAYS',
  ThreeMinutes = 'THREE_MINUTES',
  TwelveHours = 'TWELVE_HOURS',
  TwoHours = 'TWO_HOURS'
}

export type KlineResponse = {
  __typename?: 'KlineResponse';
  count: Scalars['Int']['output'];
  data: Array<Kline>;
  endTime?: Maybe<Scalars['Float']['output']>;
  interval: Scalars['String']['output'];
  startTime?: Maybe<Scalars['Float']['output']>;
  symbol: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  getHistoricalKlines: KlineResponse;
  getLatestKlines: KlineResponse;
};


export type QueryGetHistoricalKlinesArgs = {
  endTime?: InputMaybe<Scalars['Float']['input']>;
  interval: KlineInterval;
  limit?: InputMaybe<Scalars['Int']['input']>;
  startTime?: InputMaybe<Scalars['Float']['input']>;
  symbol: Scalars['String']['input'];
};


export type QueryGetLatestKlinesArgs = {
  interval: KlineInterval;
  limit?: InputMaybe<Scalars['Int']['input']>;
  symbol: Scalars['String']['input'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Kline: ResolverTypeWrapper<Kline>;
  KlineInterval: KlineInterval;
  KlineResponse: ResolverTypeWrapper<KlineResponse>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  Float: Scalars['Float']['output'];
  Int: Scalars['Int']['output'];
  Kline: Kline;
  KlineResponse: KlineResponse;
  Query: {};
  String: Scalars['String']['output'];
};

export type KlineResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Kline'] = ResolversParentTypes['Kline']> = {
  close?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  closeTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  high?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  interval?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  low?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  open?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  openTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  quoteAssetVolume?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  symbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  takerBuyBaseAssetVolume?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  takerBuyQuoteAssetVolume?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  trades?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  volume?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type KlineResponseResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['KlineResponse'] = ResolversParentTypes['KlineResponse']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  data?: Resolver<Array<ResolversTypes['Kline']>, ParentType, ContextType>;
  endTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  interval?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  symbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getHistoricalKlines?: Resolver<ResolversTypes['KlineResponse'], ParentType, ContextType, RequireFields<QueryGetHistoricalKlinesArgs, 'interval' | 'symbol'>>;
  getLatestKlines?: Resolver<ResolversTypes['KlineResponse'], ParentType, ContextType, RequireFields<QueryGetLatestKlinesArgs, 'interval' | 'symbol'>>;
};

export type Resolvers<ContextType = DataSourceContext> = {
  Kline?: KlineResolvers<ContextType>;
  KlineResponse?: KlineResponseResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
};

