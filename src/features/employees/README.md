# Team members

The dedicated page is src/features/employees/TeamPage.jsx. It lists members from GET /api/v1/users with search, membership status filters, and pagination; role/status changes use workspace-scoped APIs. Invitations use POST /api/v1/workspaces/invitations and require SMTP. Backend authorization remains authoritative.