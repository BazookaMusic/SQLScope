# api-tests/integration.py
import unittest
from fastapi.testclient import TestClient
from api.index import app  # Assuming your FastAPI app is instantiated in api/index.py

class TestIdentityRequest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_identity_request(self):
        response = self.client.get("/transpile", params={"query":"select * from a", "inDialect":"identity", "outDialect":"identity"})  # Adjust the endpoint as necessary
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"query": "select * from a" })  # Adjust the expected response as necessary

    def test_all_dialects(self):
        response = self.client.get("/dialects")
        self.assertEqual(response.status_code, 200)

    

if __name__ == "__main__":
    unittest.main()