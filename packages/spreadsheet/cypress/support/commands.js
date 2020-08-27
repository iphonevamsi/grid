// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add("typeInSlate", { prevSubject: true }, (subject, text) => {
  return cy.wrap(subject).then((subject) => {
    subject[0].dispatchEvent(
      new InputEvent("beforeinput", { inputType: "insertText", data: text })
    );
    return subject;
  });
});

Cypress.Commands.add(
  "enterText",
  { prevSubject: true },
  (subject, text, cell, gridRef) => {
    const pos = gridRef.current.grid.getCellOffsetFromCoords(cell);
    return (
      cy
        .get(".rowsncolumns-grid-container")
        .dblclick(pos.x, pos.y)
        // .type(text)
        .get("[data-gramm='false']")
        .eq(1)
        .typeInSlate(text)
        .wait(100)
        .type("{enter}")
    );
  }
);

// import "cypress-plugin-snapshots/commands";
