from api import translator


def test_dialects_includes_mysql():
    dialect_names = translator.dialects()
    assert "MySQL" in dialect_names


def test_is_supported_dialect_true_for_known_dialect():
    assert translator.is_supported_dialect("MySQL")
    assert translator.is_supported_dialect("mysql")


def test_is_supported_dialect_false_for_unknown_dialect():
    assert not translator.is_supported_dialect("not_a_real_dialect")


def test_translate_returns_expected_sql_list():
    translated = translator.translate("select * from tbl", "mysql", "postgres")
    assert translated == ["SELECT * FROM tbl"]
