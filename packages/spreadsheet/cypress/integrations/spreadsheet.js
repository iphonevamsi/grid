context("Actions", () => {
  beforeEach(() => {
    cy.visit("http://localhost:9003/iframe.html?id=spreadsheet--default");
  });

  it("visits the app", () => {
    cy.get(".rowsncolumns-grid-container")
      .trigger("mousemove", { clientX: 100, clientY: 100 })
      .dblclick();

    cy.get('[data-gramm="false"]').typeInSlate("hello").type("{enter}");
  });
});
