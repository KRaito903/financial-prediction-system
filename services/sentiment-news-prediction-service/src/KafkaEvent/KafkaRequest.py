from KafkaEvent.KafkaEvent import KafkaEvent

class KafkaRequest(KafkaEvent):
  def __init__(self, id: int, from_service: str, name: str, payload: dict):
    super().__init__(id, from_service, name, payload)