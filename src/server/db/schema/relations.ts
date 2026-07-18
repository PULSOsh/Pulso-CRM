import { relations } from "drizzle-orm";
import { activities } from "./activities";
import {
  briefingSubmissionAnswers,
  briefingSubmissions,
  briefingTemplates,
} from "./briefings";
import { companies } from "./companies";
import { contacts } from "./contacts";
import { opportunities } from "./opportunities";
import { tasks } from "./tasks";
import { users } from "./users";

export const opportunitiesRelations = relations(opportunities, ({ one }) => ({
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
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  actor: one(users, {
    fields: [activities.actorUserId],
    references: [users.id],
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
