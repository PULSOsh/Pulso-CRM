"use client";

export type QuestionDef = {
  id: string;
  type: string;
  title: string;
  placeholder?: string;
  isRequired: boolean;
  options?: { label: string; value: string }[];
};

export function QuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: QuestionDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const commonProps = {
    required: question.isRequired,
    className: "w-full p-3 border border-slate-300 rounded-md mt-2",
  };

  switch (question.type) {
    case "textarea":
      return (
        <textarea
          {...commonProps}
          rows={4}
          placeholder={question.placeholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "radio":
      return (
        <div className="flex flex-col gap-2 mt-2">
          {question.options?.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-md hover:bg-slate-50"
            >
              <input
                type="radio"
                name={question.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4 text-orange-600 focus:ring-orange-500"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      );
    case "checkbox": {
      const currentValues = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-col gap-2 mt-2">
          {question.options?.map((opt) => {
            const isChecked = currentValues.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...currentValues, opt.value]);
                    } else {
                      onChange(currentValues.filter((v: string) => v !== opt.value));
                    }
                  }}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      );
    }
    case "file":
      return (
        <input
          type="file"
          {...commonProps}
          onChange={(e) => {
            // For MVP, just storing the file object or name. Later, actual S3 upload hook.
            const file = e.target.files?.[0];
            onChange(file);
          }}
        />
      );
    default:
      return (
        <input
          type={question.type === "email" ? "email" : "text"}
          {...commonProps}
          placeholder={question.placeholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
