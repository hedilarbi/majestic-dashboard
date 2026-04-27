"use client";

import { FORM_QUESTION_TYPE_OPTIONS, OPTION_BASED_QUESTION_TYPES } from "@/lib/blogue/constants";
import { createEmptyQuestion } from "@/lib/blogue/normalize";
import { Icon } from "@/components/ui/icons";

const INPUT_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

export default function FormQuestionsEditor({ questions = [], onChange }) {
  const updateQuestion = (questionId, updates) => {
    onChange?.(
      questions.map((question) =>
        question.id === questionId ? { ...question, ...updates } : question,
      ),
    );
  };

  const removeQuestion = (questionId) => {
    onChange?.(questions.filter((question) => question.id !== questionId));
  };

  const addQuestion = () => {
    onChange?.([...questions, createEmptyQuestion()]);
  };

  const addOption = (questionId) => {
    onChange?.(
      questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: [...(question.options || []), `Option ${(question.options || []).length + 1}`],
            }
          : question,
      ),
    );
  };

  const updateOption = (questionId, optionIndex, value) => {
    onChange?.(
      questions.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        const nextOptions = [...(question.options || [])];
        nextOptions[optionIndex] = value;

        return { ...question, options: nextOptions };
      }),
    );
  };

  const removeOption = (questionId, optionIndex) => {
    onChange?.(
      questions.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        return {
          ...question,
          options: (question.options || []).filter(
            (_option, currentIndex) => currentIndex !== optionIndex,
          ),
        };
      }),
    );
  };

  return (
    <div className="space-y-4">
      {questions.map((question, index) => {
        const needsOptions = OPTION_BASED_QUESTION_TYPES.has(question.type);

        return (
          <div
            key={question.id}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-sm font-semibold text-slate-900">
                Question {index + 1}
              </h4>
              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-red-500"
                aria-label="Supprimer la question"
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Intitule
                </label>
                <input
                  type="text"
                  value={question.label}
                  onChange={(event) =>
                    updateQuestion(question.id, { label: event.target.value })
                  }
                  className={INPUT_CLASSES}
                  placeholder="Ex : Quel est votre sujet prefere ?"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Type de réponse
                </label>
                <select
                  value={question.type}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      type: event.target.value,
                      options: OPTION_BASED_QUESTION_TYPES.has(event.target.value)
                        ? question.options?.length
                          ? question.options
                          : ["Option 1", "Option 2"]
                        : [],
                    })
                  }
                  className={INPUT_CLASSES}
                >
                  {FORM_QUESTION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={question.placeholder}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      placeholder: event.target.value,
                    })
                  }
                  className={INPUT_CLASSES}
                  placeholder="Texte d'aide"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Texte d&apos;aide
                </label>
                <input
                  type="text"
                  value={question.helpText}
                  onChange={(event) =>
                    updateQuestion(question.id, { helpText: event.target.value })
                  }
                  className={INPUT_CLASSES}
                  placeholder="Informations complementaires"
                />
              </div>
            </div>

            <label className="mt-4 inline-flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={question.required === true}
                onChange={(event) =>
                  updateQuestion(question.id, { required: event.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
              />
              Reponse obligatoire
            </label>

            {needsOptions ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <h5 className="text-sm font-semibold text-slate-900">
                    Options
                  </h5>
                  <button
                    type="button"
                    onClick={() => addOption(question.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary/90"
                  >
                    <Icon name="plus" className="h-4 w-4" />
                    Ajouter
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {(question.options || []).map((option, optionIndex) => (
                    <div key={`${question.id}-option-${optionIndex}`} className="flex gap-3">
                      <input
                        type="text"
                        value={option}
                        onChange={(event) =>
                          updateOption(question.id, optionIndex, event.target.value)
                        }
                        className={INPUT_CLASSES}
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(question.id, optionIndex)}
                        className="rounded-xl border border-slate-200 px-3 text-slate-500 transition hover:border-red-200 hover:text-red-500"
                        aria-label="Supprimer l'option"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addQuestion}
        className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
      >
        <Icon name="plus" className="h-4 w-4" />
        Ajouter une question
      </button>
    </div>
  );
}
