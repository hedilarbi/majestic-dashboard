const buildPersonName = (person) => {
  if (!person || typeof person !== "object") {
    return "";
  }

  return [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
};

const normalizeQuestion = (question) => ({
  id:
    question?._id ||
    question?.id ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: question?.label || "",
  type: question?.type || "text",
  required: question?.required === true,
  placeholder: question?.placeholder || "",
  helpText: question?.helpText || "",
  options: Array.isArray(question?.options)
    ? question.options.map((option) => String(option || ""))
    : [],
});

export const normalizeBlogContent = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  return {
    id: item._id || item.id || "",
    type: item.type || "",
    title: item.title || "",
    slug: item.slug || "",
    excerpt: item.excerpt || "",
    image: item.image || "",
    contentHtml: item.contentHtml || "",
    videoUrl: item.videoUrl || "",
    thumbnail: item.thumbnail || "",
    formDescription: item.formDescription || "",
    questions: Array.isArray(item.questions)
      ? item.questions.map(normalizeQuestion)
      : [],
    isPublished: item.isPublished !== false,
    createdAt: item.createdAt || "",
    updatedAt: item.updatedAt || "",
    createdBy: item.createdBy || null,
    updatedBy: item.updatedBy || null,
    createdByName: buildPersonName(item.createdBy),
    updatedByName: buildPersonName(item.updatedBy),
  };
};

export const normalizeBlogContents = (data) => {
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map(normalizeBlogContent).filter(Boolean);
};

export const createEmptyQuestion = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  type: "text",
  required: false,
  placeholder: "",
  helpText: "",
  options: ["Option 1", "Option 2"],
});

export const createEmptyBlogFormState = (type) => ({
  title: "",
  excerpt: "",
  isPublished: true,
  imageFile: null,
  image: "",
  contentHtml: "",
  videoUrl: "",
  thumbnailFile: null,
  thumbnail: "",
  formDescription: "",
  questions: type === "form" ? [createEmptyQuestion()] : [],
});
