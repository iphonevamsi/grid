context("Actions", () => {
  beforeEach(() => {
    cy.visit("http://localhost:9003/iframe.html?id=spreadsheet--default");
  });

  it("can enter values in a cell", () => {
    cy.get(".rowsncolumns-grid-container")
      .dblclick(60, 60)
      .get("[data-gramm='false']")
      .typeInSlate("hello")
      .wait(100)
      .type("{enter}")
      .get("body")
      .toMatchImageSnapshot();
  });

  it("can evaluate formulas", () => {
    cy.get(".rowsncolumns-grid-container")
      .dblclick(60, 60)
      .get("[data-gramm='false']")
      .typeInSlate("=SUM(2,2)")
      .wait(100)
      .type("{enter}")
      .get("body")
      .toMatchImageSnapshot();
  });
});
