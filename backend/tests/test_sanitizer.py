import pytest
from backend.ai.utils.sanitizer import MessageSanitizer

def test_sanitize_content():
    """Test content sanitization"""
    test_cases = [
        # Test HTML escaping
        (
            "<script>alert('xss')</script>",
            "&lt;script&gt;alert('xss')&lt;/script&gt;"
        ),
        # Test iframe removal
        (
            "<iframe src='evil.com'></iframe>",
            ""
        ),
        # Test script tag removal
        (
            "Hello <script>bad()</script> World",
            "Hello World"
        ),
        # Test whitespace handling
        (
            "Too    many    spaces",
            "Too many spaces"
        ),
        # Test newline handling
        (
            "Line 1\n\n\nLine 2",
            "Line 1 Line 2"
        ),
        # Test normal text
        (
            "Hello, World!",
            "Hello, World!"
        )
    ]
    
    for input_text, expected in test_cases:
        result = MessageSanitizer.sanitize_content(input_text)
        assert result == expected

def test_sanitize_message():
    """Test message object sanitization"""
    message = {
        "id": "msg_123",
        "timestamp": 1234567890,
        "user_id": "user_123",
        "type": "user_message",
        "content": "<script>alert('xss')</script>",
        "question_number": 1,
        "is_correct": True,
        "unsafe_field": "should be removed"
    }
    
    sanitized = MessageSanitizer.sanitize_message(message)
    
    # Check that content is sanitized
    assert "<script>" not in sanitized["content"]
    
    # Check that allowed fields are preserved
    assert "id" in sanitized
    assert "timestamp" in sanitized
    assert "user_id" in sanitized
    assert "type" in sanitized
    assert "question_number" in sanitized
    assert "is_correct" in sanitized
    
    # Check that unsafe fields are removed
    assert "unsafe_field" not in sanitized

def test_sanitize_empty_message():
    """Test sanitization of empty message"""
    message = {}
    sanitized = MessageSanitizer.sanitize_message(message)
    assert sanitized == {}
