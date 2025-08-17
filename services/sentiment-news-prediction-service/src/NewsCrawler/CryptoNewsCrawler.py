from .NewsCrawler import NewsCrawler
from .RawCryptoNews import RawCryptoNews
import requests
from bs4 import BeautifulSoup

URL = "https://cryptonews.com/news/page/1/"

class CryptoNewsCrawler(NewsCrawler):
  __url = URL
  __headers = { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0" }

  def __init__(self):
    super().__init__()

  def crawl(self) -> list:
    response = requests.get(url=CryptoNewsCrawler.__url, headers=CryptoNewsCrawler.__headers)

    if (response.status_code != 200):
      raise Exception(f"Failed to fetch news: {response.status_code}")

    temp_news = self.__get_list_titles_and_links(response.content)
    res = []
    for news in temp_news:
      sub_header = self.__get_subheader_from_link(url=news['link'])
      res.append( RawCryptoNews(title=news['title'], sub_header=sub_header) )
    return res

  def __get_subheader_from_link(self, url: str) -> str:
    """
    Extract content from the raw HTML content.

    :param raw_html: The raw HTML content to parse.
    :return: A list of CryptoNews objects containing the subject, text, and title.
    """
    response = requests.get(url=url, headers=self.__headers)
    # print(url)
    if (response.status_code != 200):
      raise Exception(f"Failed to fetch news content: {response.status_code}")
    soup = BeautifulSoup(response.content, 'html.parser')
    news = soup.find('div', class_='single-post__subheader')
    if not news:
      news = soup.find('p')
    return news.text.strip()

  def __get_list_titles_and_links(self, response_content):
    """
    Extract titles from the raw HTML content.

    :param raw_html: The raw HTML content to parse.
    :return: A list of titles extracted from the HTML.
    """
    # Placeholder for actual implementation
    soup = BeautifulSoup(response_content, 'html.parser')
    all_news = soup.find_all('div', class_='archive-template-latest-news__wrap')

    temp_news = []
    for news in all_news:
      soup_news = BeautifulSoup(str(news), 'html.parser')
      title = soup_news.find('div', class_='archive-template-latest-news__title')
      link = soup_news.find('a')

      temp_news.append({
        'title': title.text.strip(),
        'link': link['href']
      })
    return temp_news