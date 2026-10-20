---
title: "Text Contains Any"
description: "Check if a text contains any of the values in a list"
order: 3
pbix: "/files/power-bi/examples/text-contains-any.pbix"
---

I first posted this example to the Power BI Community in response to a question: [Power BI Community Post](https://community.fabric.microsoft.com/t5/Desktop/quot-Text-Contains-quot-Filter-with-List-as-Argument/m-p/3272505#M1096509)

## What's the purpose of this?

You want to filter a table based on whether the text in a column contains any of the values in a list. Matching to a single value is easy, but matching to a list of values is not straightforward.

For example, let's say you have a list of products to watch, but this list does not contain the full product name, only a part of it (perhaps in order to match multiple similar products, like "Pulse Hammer", "Sledge Hammer", "Rubber Mallet", "Large Rubber Mallet", etc. Our filter list would contain "Hammer" and "Mallet").

## Example

You have a table:

| Row | Text        |
|-----|-------------|
| 1   | abcdefg1234567 |
| 2   | abc123      |
| 3   | adg147      |
| 4   | efg567      |
| 5   | aceg1357    |
| 6   | bcd234      |

You want to return rows that contain any of the following substrings: `123`, `567`, `135`.

This would match rows 1, 2, 4 and 5, but not rows 3 or 6.

## Solution

There is a `List.ContainsAny` function which almost does what we want. We would want a `Text.ContainsAny`, that allows us to enter a list as the second argument. Unfortunately, this function does not exist. So instead, we have to run the `Text.Contains` function for each item in our list. A good way to do that is using `List.MatchesAny` which returns true if some function on each item of the list returns true at least once.

Here is the code:

```powerquery
Table.SelectRows(TableName, (Row) => List.MatchesAny(SubstringList, (Substring) => Text.Contains(Row[ColumnToBeFiltered], Substring)))
```

## How it Works

For each row we do the following:
1. For each Substring, we check if the ColumnToBeFiltered (of the current row) contains that substring using `Text.Contains`
2. This creates a list of true and false values
3. The list is run through `List.MatchesAny`, which returns true if there is at least one true in the list

## Function Explanation

`(Parameter) => Expression` are inline functions, where the entire evaluation context is saved in the parameter:
- `Row` contains a row since the `Table.SelectRows` function iterates over rows in a table
- `Substring` contains an item from `SubstringList` since it iterates over that list
- You could name those parameters however you want
- `TableName`, `SubstringList` and `ColumnToBeFiltered` refer to things outside this expression and should be adapted accordingly

## Note on `each` Keyword

In the documentation both `Table.SelectRows` and `List.MatchesAny` use the "each" keyword. These **cannot** be nested in this situation. `each [column]` is actually a shortening of `(_) => _[column]`, the `_` is implicit. In this case if I used each for the row and the substring, then when I would try to use `_` to refer to the substring, it would attempt to give me the row, and I get an error.

## Code to generate sample data

{% raw %}
```powerquery
let
    Source = Table.FromRows(Json.Document(Binary.Decompress(Binary.FromText("NYy5EcAwCAR7uVgJAsnFMAS2HvrvwMiMw917VEEouJ8x13aqLK1fsKKoqUN9yAenk2QqgTH4y+2kYzlxS9FDxGf8wewF", BinaryEncoding.Base64), Compression.Deflate)), let _t = ((type nullable text) meta [Serialized.Text = true]) in type table [Column1 = _t, ColumnToBeFiltered = _t]),
    Types = Table.TransformColumnTypes(Source,{{"Column1", Int64.Type}, {"ColumnToBeFiltered", type text}})
in
    Types
```
{% endraw %}

## Substring List
```powerquery
= {"123", "567", "135"}
```

## Power BI Desktop File

[Download Power BI Desktop File](/files/power-bi/examples/text-contains-any.pbix)
