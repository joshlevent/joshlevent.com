---
title: "Parse Date from Filename"
description: "Extract Year and Month from Filename"
order: 2
pbix: "/files/power-bi/examples/parse-date-from-filename.pbix"
---

## What's the purpose of this?

You want to extract the year and month from a filename.

## Example

You receive monthly ERP reports named like

```
monthly_revenue_cost_report_qZa_2024_05.xlsx
monthly_revenue_cost_report_TpMwa_2024_06.xlsx
…
```

Each workbook contains a table of values for every team in each business unit, but the sheet itself has no date column.
To analyse the series correctly we must derive the reporting period from the file name.


## 1 Generate the sample data (optional)

```powerquery
let
    StartDate     = #date(2023, 1, 1),
    EndDate       = #date(2025, 12, 31),
    BusinessUnits = {"Sales","Marketing","R&D","Operations"},
    Teams         = {1..10},

    RandInt = (a,b) => Number.RoundDown(Number.RandomBetween(a,b)),
    RandStr = (a,b) =>
        Text.Combine(
            List.Transform(
                {1..RandInt(a,b)},
                each Character.FromNumber(RandInt(65,90))
            )
        ),

    Months = List.Generate(
                () => Date.StartOfMonth(StartDate),
                each _ <= Date.StartOfMonth(EndDate),
                each Date.AddMonths(_,1)
             ),

    Files = List.Transform(
        Months,
        (m) =>
            let
                fname = "monthly_revenue_cost_report_" &
                        RandStr(3,6) & "_" &
                        Date.ToText(m,"yyyy_MM") & ".xlsx",

                rows  = List.Combine(
                            List.Transform(
                                BusinessUnits,
                                (bu) => List.Transform(
                                            Teams,
                                            (t) => [
                                                revenue       = RandInt(50000,200000),
                                                expenses      = RandInt(20000,150000),
                                                business_unit = bu,
                                                team          = t
                                            ]
                                        )
                            )
                        )
            in
                [filename=fname, data=Table.FromRecords(rows)]
    ),

    SampleFiles = Table.FromRecords(Files)
in
    SampleFiles
```

Result: a table **SampleFiles** with columns **filename** (text) and **data** (nested table).


## 2 Create a reusable transformation query to extract the date from the filename

```powerquery
AddReportingPeriod = (tbl as table) as table =>
        let
            addDate =
                Table.AddColumn(
                    tbl, "report_date",
                    each
                        let txt = Text.End([filename], 12)      // "yyyy_MM.xlsx"
                        in  #date(
                                Number.FromText(Text.Start(txt,4)),
                                Number.FromText(Text.Middle(txt,5,2)),
                                1),
                    type date),

            addYear  = Table.AddColumn(addDate,  "year",        each Date.Year([report_date]),   Int64.Type),
            addMonth = Table.AddColumn(addYear,  "month_name",  each Date.ToText([report_date],"MMMM"), type text)
        in
            addMonth
```

## 3 Apply the transformation to your data

```powerquery
let
    Source     = SampleFiles,         // or connect your own data
    WithPeriod = AddReportingPeriod(Source)
in
    WithPeriod
```

The resulting table contains:

| filename | data | report_date | year | month_name |
|----------|------|-------------|------|------------|

ready for expansion and modelling in Power BI.


## How it works
1.	Text.End grabs the last 12 characters (yyyy_mm.xlsx).
2.	Text.Start isolates the first 4 characters → year.
3.	Text.Middle takes characters 5‑6 → month.
4.	#date builds the first day of that month.
5.	Table.AddColumn appends report_date (type date) to each row.

With the period now explicit you can:

* Expand the data tables
* Use report_date in your model’s calendar relationships
* Slice monthly KPIs without ambiguity


## Power BI Desktop File

[Download Power BI Desktop File](/files/power-bi/examples/parse-date-from-filename.pbix)
