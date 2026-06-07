export const DASHBOARD_PERMISSION_ACTIONS = [
  "list",
  "create",
  "update",
  "delete",
];

export const DASHBOARD_PERMISSION_DEFINITIONS = [
  { module: "dashboard", label: "Tableau de bord", actions: ["list"] },
  {
    module: "events",
    label: "Événements",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "sessions",
    label: "Séances",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "promo_codes",
    label: "Codes promo",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "session_times",
    label: "Horaires des séances",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "pricing",
    label: "Tarifs",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "subscriptions",
    label: "Abonnements",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "versions",
    label: "Versions",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "show_types",
    label: "Types de spectacle",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "home_hero",
    label: "Affiches",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "rooms",
    label: "Salles",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "staffs",
    label: "Staff",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "reservation_requests",
    label: "Demandes de réservation",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "blog_articles",
    label: "Blogue - Articles",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "blog_videos",
    label: "Blogue - Vidéos",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "blog_forms",
    label: "Blogue - Formulaires",
    actions: DASHBOARD_PERMISSION_ACTIONS,
  },
  {
    module: "blog_form_submissions",
    label: "Blogue - Soumissions de formulaires",
    actions: ["list"],
  },
  {
    module: "cash_registers",
    label: "Caisse",
    actions: ["list", "update"],
  },
  {
    module: "statistics",
    label: "Statistiques",
    actions: ["list"],
  },
  {
    module: "audit_logs",
    label: "Audit",
    actions: ["list"],
  },
  {
    module: "sales_transactions",
    label: "Ventes - Transactions",
    actions: ["list"],
  },
  {
    module: "sales_tickets",
    label: "Ventes - Billets",
    actions: ["list"],
  },
  {
    module: "sales_subscriptions",
    label: "Ventes - Abonnements",
    actions: ["list"],
  },
  {
    module: "users",
    label: "Utilisateurs",
    actions: ["list", "update"],
  },
];

const definitionLookup = new Map(
  DASHBOARD_PERMISSION_DEFINITIONS.map((definition) => [
    definition.module,
    definition,
  ]),
);

export const DASHBOARD_ROLE_LABELS = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  blog_manager: "Gestion blogue",
  cashier: "Caissier",
  ticket_office: "Guichet",
  door_staff: "Contrôle",
};

export const buildPermissionKey = (moduleKey, action) =>
  `${moduleKey}.${action}`;

export const ALL_DASHBOARD_PERMISSIONS = DASHBOARD_PERMISSION_DEFINITIONS.flatMap(
  (definition) =>
    definition.actions.map((action) =>
      buildPermissionKey(definition.module, action),
    ),
);

const ALL_DASHBOARD_PERMISSION_SET = new Set(ALL_DASHBOARD_PERMISSIONS);

export const normalizePermissionList = (permissions) => {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return Array.from(
    new Set(
      permissions
        .map((permission) =>
          typeof permission === "string" ? permission.trim() : "",
        )
        .filter((permission) => ALL_DASHBOARD_PERMISSION_SET.has(permission)),
    ),
  );
};

export const isLegacyAdmin = (user) =>
  user?.role === "admin" &&
  user?.roleDetails?.permissionsConfigured !== true;

export const hasDashboardPermission = (user, moduleKey, action) => {
  const definition = definitionLookup.get(moduleKey);

  if (!definition || !definition.actions.includes(action)) {
    return false;
  }

  if (!user) {
    return false;
  }

  if (user.role === "super_admin" || isLegacyAdmin(user)) {
    return true;
  }

  if (user.role !== "admin") {
    return false;
  }

  return normalizePermissionList(user?.roleDetails?.permissions).includes(
    buildPermissionKey(moduleKey, action),
  );
};

export const getDashboardModuleDefinition = (moduleKey) =>
  definitionLookup.get(moduleKey) || null;

export const getSupportedModuleActions = (moduleKey) =>
  getDashboardModuleDefinition(moduleKey)?.actions || [];

export const buildPermissionsState = (
  permissions = [],
  { legacyFullAccess = false } = {},
) => {
  const normalizedPermissions = legacyFullAccess
    ? ALL_DASHBOARD_PERMISSIONS
    : normalizePermissionList(permissions);
  const granted = new Set(normalizedPermissions);

  return DASHBOARD_PERMISSION_DEFINITIONS.reduce((accumulator, definition) => {
    accumulator[definition.module] = DASHBOARD_PERMISSION_ACTIONS.reduce(
      (moduleState, action) => {
        moduleState[action] =
          definition.actions.includes(action) &&
          granted.has(buildPermissionKey(definition.module, action));
        return moduleState;
      },
      {},
    );

    return accumulator;
  }, {});
};
