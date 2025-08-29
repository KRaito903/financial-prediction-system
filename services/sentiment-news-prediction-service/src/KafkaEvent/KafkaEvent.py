from dataclasses import dataclass

@dataclass
class KafkaEvent:
  id: int
  from_service: str
  name: str
  payload: dict