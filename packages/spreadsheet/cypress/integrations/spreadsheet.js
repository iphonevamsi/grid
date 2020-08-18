context("Actions", () => {
  beforeEach(() => {
    cy.visit("http://localhost:9003/iframe.html?id=spreadsheet--default");
  });

  it("can enter values in a cell", () => {
    cy.get(document);
    cy.get(".rowsncolumns-grid-container").dblclick(60, 60);

    cy.get("[contenteditable]")
      .typeInSlate("hello")
      .type("{enter}");

    // cy.get("body").toMatchImageSnapshot();
  });

  it("can evaluate formulas", () => {
    cy.get(document);
    cy.get(".rowsncolumns-grid-container").dblclick(60, 60);

    cy.get("[contenteditable]")
      .typeInSlate("=SUM(2,2)")
      .type("{enter}");

    // cy.get("body").toMatchImageSnapshot();
  });
});
