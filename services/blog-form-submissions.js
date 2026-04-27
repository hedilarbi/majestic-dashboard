import "server-only";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

const fetchWithAuth = async ({ path, token, baseUrl }) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
    message: data?.message || "",
  };
};

const buildFullName = (person) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ").trim();

const normalizeAnswer = (answer) => ({
  questionId: answer?.questionId || "",
  label: answer?.label || "",
  type: answer?.type || "text",
  required: answer?.required === true,
  value: answer?.value || "",
  values: Array.isArray(answer?.values) ? answer.values : [],
});

const normalizeForm = (item) => ({
  id: item?._id || "",
  title: item?.title || "",
  slug: item?.slug || "",
  isPublished: item?.isPublished === true,
  formDescription: item?.formDescription || "",
  questions: Array.isArray(item?.questions) ? item.questions : [],
  submissionCount: Number(item?.submissionCount || 0),
  latestSubmissionAt: item?.latestSubmissionAt || "",
  createdAt: item?.createdAt || "",
  updatedAt: item?.updatedAt || "",
});

const normalizeSubmission = (item) => ({
  id: item?._id || "",
  formId:
    typeof item?.formId === "object" && item?.formId?._id
      ? item.formId._id
      : item?.formId || "",
  formTitle: item?.formTitle || item?.formId?.title || "",
  formSlug: item?.formSlug || item?.formId?.slug || "",
  customerName: buildFullName(item?.customerSnapshot || item?.userId || {}),
  customerEmail:
    item?.customerSnapshot?.email || item?.userId?.email || "",
  answers: Array.isArray(item?.answers)
    ? item.answers.map(normalizeAnswer)
    : [],
  createdAt: item?.createdAt || "",
});

export const getBlogSubmissionForms = async () => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      items: [],
      error: auth.message || "Non authentifié.",
      status: resolveAuthStatus(auth.message),
    };
  }

  const result = await fetchWithAuth({
    path: "/blog-form-submissions/forms",
    token: auth.token,
    baseUrl: auth.baseUrl,
  });

  return {
    items: Array.isArray(result.data?.items)
      ? result.data.items.map(normalizeForm)
      : [],
    error: result.ok ? "" : result.message || "Erreur serveur.",
    status: result.status,
  };
};

export const getBlogFormSubmissions = async (formId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      form: null,
      items: [],
      error: auth.message || "Non authentifié.",
      status: resolveAuthStatus(auth.message),
    };
  }

  if (!formId) {
    return {
      form: null,
      items: [],
      error: "Formulaire invalide.",
      status: 400,
    };
  }

  const result = await fetchWithAuth({
    path: `/blog-form-submissions/forms/${encodeURIComponent(formId)}/submissions`,
    token: auth.token,
    baseUrl: auth.baseUrl,
  });

  return {
    form: result.data?.form ? normalizeForm(result.data.form) : null,
    items: Array.isArray(result.data?.submissions)
      ? result.data.submissions.map(normalizeSubmission)
      : [],
    error: result.ok ? "" : result.message || "Erreur serveur.",
    status: result.status,
  };
};

export const getBlogFormSubmissionDetails = async (submissionId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      item: null,
      error: auth.message || "Non authentifié.",
      status: resolveAuthStatus(auth.message),
    };
  }

  if (!submissionId) {
    return {
      item: null,
      error: "Soumission invalide.",
      status: 400,
    };
  }

  const result = await fetchWithAuth({
    path: `/blog-form-submissions/${encodeURIComponent(submissionId)}`,
    token: auth.token,
    baseUrl: auth.baseUrl,
  });

  return {
    item: result.data?.item ? normalizeSubmission(result.data.item) : null,
    error: result.ok ? "" : result.message || "Erreur serveur.",
    status: result.status,
  };
};
