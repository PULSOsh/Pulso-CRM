import { relations } from "drizzle-orm";
import { activities } from "./activities";
import { briefingSubmissionAnswers, briefingSubmissions, briefingTemplates } from "./briefings";
import { companies } from "./companies";
import { contacts } from "./contacts";
import { attachments, storedFiles } from "./files";
import { opportunities, opportunityProducts } from "./opportunities";
import { products } from "./products";
import { tasks } from "./tasks";
import { users } from "./users";

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  company: one(companies, {
    fields: [opportunities.companyId],
    references: [companies.id],
  }),
  primaryContact: one(contacts, {
    fields: [opportunities.primaryContactId],
    references: [contacts.id],
  }),
  owner: one(users, {
    fields: [opportunities.ownerUserId],
    references: [users.id],
  }),
  activities: many(activities),
  tasks: many(tasks),
  opportunityProducts: many(opportunityProducts),
}));

export const opportunityProductsRelations = relations(opportunityProducts, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [opportunityProducts.opportunityId],
    references: [opportunities.id],
  }),
  product: one(products, {
    fields: [opportunityProducts.productId],
    references: [products.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  actor: one(users, {
    fields: [activities.actorUserId],
    references: [users.id],
  }),
  opportunity: one(opportunities, {
    fields: [activities.opportunityId],
    references: [opportunities.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [tasks.opportunityId],
    references: [opportunities.id],
  }),
}));

export const briefingSubmissionsRelations = relations(briefingSubmissions, ({ one, many }) => ({
  template: one(briefingTemplates, {
    fields: [briefingSubmissions.templateId],
    references: [briefingTemplates.id],
  }),
  answers: many(briefingSubmissionAnswers),
  contact: one(contacts, {
    fields: [briefingSubmissions.contactId],
    references: [contacts.id],
  }),
  company: one(companies, {
    fields: [briefingSubmissions.companyId],
    references: [companies.id],
  }),
  opportunity: one(opportunities, {
    fields: [briefingSubmissions.opportunityId],
    references: [opportunities.id],
  }),
}));

export const briefingSubmissionAnswersRelations = relations(
  briefingSubmissionAnswers,
  ({ one }) => ({
    submission: one(briefingSubmissions, {
      fields: [briefingSubmissionAnswers.submissionId],
      references: [briefingSubmissions.id],
    }),
  }),
);

export const storedFilesRelations = relations(storedFiles, ({ many }) => ({
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  file: one(storedFiles, {
    fields: [attachments.fileId],
    references: [storedFiles.id],
  }),
}));
