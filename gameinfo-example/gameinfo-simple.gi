"Root"
{
    // Comment
	test_string "string"
	test_number 20
	test_float  3.0
	test_bool   1

	string_keys
	{
		"string_key1" 20
		"string_key2" 1
		"string_key3" 3.0
	}

	string_keys_and_values
	{
		"string_key1" "1"
		"string_key2" "string"
		"string_key3" "3.0"
		"string_key4" "true"
	}

	unquoted_string_value
	{
	    key1    value1
	    "key2"  value2
	}

	object_with_children
	{
	    children
	    {
	        key value
	    }

	    parent
	    {
	        children
	        {
	            key value
	        }
	    }
	}

	empty_object
	{
	}

	string_with_slash "path/to/file"
}