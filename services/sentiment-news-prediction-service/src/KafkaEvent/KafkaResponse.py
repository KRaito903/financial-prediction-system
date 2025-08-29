from KafkaEvent.KafkaEvent import KafkaEvent

class KafkaResponse(KafkaEvent):
  def __init__(self, id: int, from_service: str, name: str, payload: dict):
    super().__init__(id, from_service, name, payload)
  
  def to_dict(self):
    return {
      "id": self.id,
      "from_service": self.from_service,
      "name": self.name,
      "payload": self.payload
    }