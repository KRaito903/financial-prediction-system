from NewsRepository.INewsRepository import INewsRepository
from News.CryptoNews import CryptoNews
from psycopg_pool import ConnectionPool

class NewsRepositoryPostgres(INewsRepository):
    """
    Implementation of the News Repository using PostgreSQL.
    """

    def __init__(self, pool: ConnectionPool):
        """
        Initialize the repository with a database connection.

        :param db_connection: The database connection object.
        """
        self.__pool = pool
        self.__test()

    def __test(self):
        """
        Test the database connection by executing a simple query.
        """
        with self.__pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1;")
                _ = cursor.fetchone()
                print(f"Database connected successfully")
    
    def get_all(self, page: int = 1, limit: int = 10) -> list[CryptoNews]:
        offset = (limit * (page - 1))
        with self.__pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                        SELECT subject, text, title, url, utc_published_at, sentiment_score, created_at, last_modified_at, id
                        FROM news
                        ORDER BY utc_published_at DESC
                        LIMIT %s OFFSET %s;
                    """,
                    (limit, offset,)
                )
                news_items = cursor.fetchall()
        return [CryptoNews(*item) for item in news_items] if news_items else []

    def get_by_id(self, id: int) -> CryptoNews | None:
        with self.__pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                        SELECT subject, text, title, url, utc_published_at, sentiment_score, created_at, last_modified_at, id
                        FROM news
                        WHERE id = %s;
                    """,
                    (id,)
                )
                news_item = cursor.fetchone()
        return CryptoNews(*news_item) if news_item else None

    def get_by_url(self, url: str) -> CryptoNews | None:
        with self.__pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                        SELECT subject, text, title, url, utc_published_at, sentiment_score, created_at, last_modified_at, id
                        FROM news
                        WHERE url = %s;
                    """,
                    (url,)
                )
                news_item = cursor.fetchone()
        return CryptoNews(*news_item) if news_item else None

    def get_by_timeframe(self, start, end) -> list[CryptoNews]:
        # Implementation for fetching news within a specific timeframe
        with self.__pool.connection() as conn:
            with conn.cursor() as cursor:
                pass

    def get_n_latest(self, n: int) -> CryptoNews:
        with self.__pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                        SELECT subject, text, title, url, utc_published_at, sentiment_score, created_at, last_modified_at, id
                        FROM news
                        ORDER BY utc_published_at DESC
                        LIMIT %s;
                    """,
                    (n,)
                )
                news_items = cursor.fetchall()
        return [CryptoNews(*item) for item in news_items] if news_items else []

    def create(self, news: CryptoNews) -> int:
        with self.__pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                        INSERT INTO news (title, subject, text, utc_published_at, sentiment_score, url)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id;
                    """,
                    (
                        news.title,
                        news.subject,
                        news.text,
                        news.published_time,
                        news.sentiment_score if news.sentiment_score is not None else 0,
                        news.url
                    )
                )
                news_id = cursor.fetchone()[0]
        return news_id
    
    def create_many(self, news_list: list[CryptoNews]) -> None:
        data_to_insert = [
            (
                news.title,
                news.subject,
                news.text,
                news.published_time,
                news.sentiment_score if news.sentiment_score is not None else 0,
                news.url
            ) for news in news_list
        ]

        while 1:
            data = data_to_insert[-1]
            if self.get_by_url(data[5]):
                # url already exists, remove it from the list
                data_to_insert.pop(-1)
            else:
                break

        if not data_to_insert:
            return
        with self.__pool.connection() as conn:
            with conn.cursor() as cursor:
                sql = """
                    INSERT INTO news (title, subject, text, utc_published_at, sentiment_score, url)
                    VALUES (%s, %s, %s, %s, %s, %s);
                """
                cursor.executemany(sql, data_to_insert)

    def update(self, options: dict) -> bool:
        # Implementation for updating an existing news item
        with self.__pool.connection() as conn:
            with conn.cursor() as cursor:
                pass

    def delete_by_id(self, id: int):
        with self.__pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                        DELETE FROM news
                        WHERE id = %s;
                    """,
                    (id,)
                )
                conn.commit()
    
    def delete_all(self):
        with self.__pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                        DELETE FROM news;
                    """
                )
                conn.commit()