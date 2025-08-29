from .NewsCrawler import NewsCrawler
from .RawCryptoNews import RawCryptoNews
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone
import random
import time

URL = "https://cryptonews.com/news/page/1/"

class CryptoNewsCrawler(NewsCrawler):
  __url = URL
  __headers = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0"
  }

  def __init__(self):
    super().__init__()

  def crawl(self) -> list:
    response = requests.get(url=CryptoNewsCrawler.__url, headers=CryptoNewsCrawler.__headers)

    if (response.status_code != 200):
      raise Exception(f"Failed to fetch news: {response.status_code}")

    temp_news = self.__get_list_metadata(response.content)
    res = []
    for news in temp_news:
      time.sleep(random.uniform(0.5, 2))
      sub_header = self.__get_subheader_from_link(url=news['link'])
      res.append( RawCryptoNews(title=news['title'], sub_header=sub_header, published_time=news['published_time'], url=news['link']) )
    return res

  def __get_subheader_from_link(self, url: str) -> str:
    """
    Extract content from the raw HTML content.

    :param raw_html: The raw HTML content to parse.
    :return: A list of CryptoNews objects containing the subject, text, and title.
    """
    response = requests.get(url=url, headers=CryptoNewsCrawler.__headers)
    if (response.status_code != 200):
      raise Exception(f"Failed to fetch news content: {response.status_code}")
    soup = BeautifulSoup(response.content, 'html.parser')
    news = soup.find('div', class_='single-post__subheader')
    if not news:
      news = soup.find('p')
    return news.text.strip()

  def __retrieve_published_timestamp(self, utc_time_string: str):
    """
    Time delta will be given as a string such as "2 hours ago", "1 day ago", etc.
    This function will convert that into a timestamp (floating point number)
    :param time_delta: The time delta string to parse.
    :return: A floating point number representing the published time.
    """
    naive_dt = datetime.strptime(utc_time_string, '%Y-%m-%d %H:%M:%S')
    aware_timezone_dt = naive_dt.replace(tzinfo=timezone.utc)
    return aware_timezone_dt.timestamp()

  def __get_list_metadata(self, response_content):
    """
    Extract titles from the raw HTML content.

    :param raw_html: The raw HTML content to parse.
    :return: A list of titles, links, published time extracted from the HTML.
    """
    # Placeholder for actual implementation
    soup = BeautifulSoup(response_content, 'html.parser')
    all_news = soup.find_all('div', class_='archive-template-latest-news__wrap')

    temp_news = []
    for news in all_news:
      soup_news = BeautifulSoup(str(news), 'html.parser')

      title_div = soup_news.find('div', class_='archive-template-latest-news__title')
      title = title_div.text.strip()

      published_time_div = soup_news.find('div', class_='archive-template-latest-news__time')
      published_time = published_time_div['data-utctime']

      link = soup_news.find('a')

      temp_news.append({
        'title': title,
        'link': link['href'],
        'published_time': self.__retrieve_published_timestamp(published_time)
      })
    return temp_news