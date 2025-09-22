import json

from api import responses


def test_ok_with_query_returns_expected_json():
    response = responses.OkWithQuery("select 1")

    assert response.status_code == 200
    assert json.loads(response.body.decode()) == {"query": "select 1"}


def test_ok_returns_empty_json():
    response = responses.Ok()

    assert response.status_code == 200
    assert json.loads(response.body.decode()) == {}


def test_ok_list_serializes_items_to_strings():
    response = responses.OkList([1, "two", 3.0], name="items")

    assert response.status_code == 200
    assert json.loads(response.body.decode()) == {"items": ["1", "two", "3.0"]}


def test_bad_request_returns_error_payload():
    error = ValueError("boom")
    response = responses.BadRequest(error)

    assert response.status_code == 400
    assert json.loads(response.body.decode()) == {"error": "boom"}
