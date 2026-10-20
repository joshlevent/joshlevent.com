// Power BI page data. Add a playlist by appending to `playlists`.
export const playlists = [
  {
    title: 'Power Query Tutorial',
    href: 'https://www.youtube.com/playlist?list=PLuYVG3dVA3HRWexd6YslKP1OiuoCff0gM',
    text: 'The basics of using Power Query: connecting to data, shaping tables and building a clean load for a Power BI model.',
  },
];

export const architectures = [
  {
    id: 'basic',
    title: 'Basic Power BI Architecture',
    image: '/images/power-bi/architectures/basic.png',
    pdf: '/files/power-bi/architectures/basic.pdf',
    text: [
      'This basic architecture is what Power BI beginners learn and should practise, because it forms the basis for more complex architectures. (The diagram above is more detailed than the other architecture diagrams, which implicitly contain all of this.)',
      'The dotted lines indicate the path that data takes during development. Publishing a report created in Power BI Desktop publishes both the semantic model and the report to the target Power BI Service workspace.',
      'During scheduled refreshes, data is pulled into the semantic model in the workspace by the Power Query code written in the Desktop application.',
      'Within the workspace, you can continue to edit the semantic model and the report; however, Power Query code cannot be edited there (as of early 2025). Be cautious: editing in two different places makes it easy to overwrite existing work.',
      'Unlike some of the more complex architectures, a single person can design and implement this end to end. Most of my students can do so after a five-day course.',
    ],
  },
  {
    id: 'dataflows',
    title: 'Dataflows Architecture',
    image: '/images/power-bi/architectures/dataflows.png',
    pdf: '/files/power-bi/architectures/dataflows.pdf',
    text: [
      'This Dataflows architecture is only a slight change from the basic architecture. It introduces one new element: Dataflows.',
      'Dataflows are Power Query jobs in the Power BI Service that output tables the way Power Query does in Power BI Desktop. Those tables are cached objects in the Service which are available as sources for Power BI everywhere.',
      'There are two reasons for upgrading from the basic architecture to this one. First, it allows you to split the data preparation from the modelling and report building, which makes it easier to divide these tasks between team members.',
      'Secondly, by creating a different Dataflow for each data source, you can logically separate points of failure. If one data source does not respond to a refresh, under the basic architecture this prevents the entire report from refreshing. With Dataflows, only the Dataflow that connects to that source fails to refresh, but it still provides its cached data to the Power BI report when that refreshes.',
      'As with the basic architecture, the dotted lines indicate the path that data takes during report development. Publishing a report created in Power BI Desktop publishes both the semantic model and the report to the target Power BI Service workspace.',
    ],
  },
  {
    id: 'medallion-concept',
    title: 'Medallion Concept Fabric Architecture',
    image: '/images/power-bi/architectures/medallion-concept.png',
    pdf: '/files/power-bi/architectures/medallion-concept.pdf',
    text: [
      'This architecture makes sense for organisations that want to fully embrace Fabric as a data platform.',
      'Here, IT is responsible for the data platform as a whole, and for the ingestion and cleaning of data. Business units are then responsible for additional transformations of data in preparation for analysis and visualisation in Power BI.',
      'The Bronze Lakehouse stores data in a raw form, as it comes from the source. The Silver Lakehouse stores all data in cleaned-up tables with standardised naming. The Gold Data Warehouse stores transformed data that has been prepared for analytics.',
      'Within the report workspace, most of the data transformations should take place in the Data Factory rather than in the Power Query that generates the semantic model. There are two reasons for this. First, potentially reusable data is then stored in the Gold Data Warehouse where it can easily be reused. Second, it creates clarity about where analytic transformations take place.',
      'There are many ways to prepare the transformations for the Data Warehouse and the Lakehouses. I recommend sticking with PySpark notebooks or Dataflows in workspaces managed by a business unit (IT-managed workspaces may wish to use SQL or other tools more suitable for data engineers). Dataflows are based on Power Query, which Power BI developers already know, so the number of languages stays small. A PySpark notebook is a good alternative for data scientists who are more familiar with Python.',
    ],
  },
];
