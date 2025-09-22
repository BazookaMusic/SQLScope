import React from 'react';

interface SchemaSectionProps {
  schema: string;
  onSchemaChange: (value: string) => void;
  error?: string | null;
}

const SchemaSection: React.FC<SchemaSectionProps> = ({
  schema,
  onSchemaChange,
  error,
}) => {
  return (
    <section className="mt-6" aria-label="Schema configuration">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-lg font-semibold text-dracula-pink">
          Schema (JSON)
        </h2>
        <p className="text-sm text-dracula-comment">
          Provide a mapping of tables to columns (optionally nested by database)
          to enable SQLGlot schema-aware validation. Leave empty to disable type
          checking.
        </p>
      </div>
      <textarea
        className="w-full min-h-[10rem] bg-dracula-selection/25 text-dracula-foreground border border-dracula-pink/40 rounded-md p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-dracula-pink/70"
        value={schema}
        onChange={(event) => onSchemaChange(event.target.value)}
        placeholder='{ "my_table": { "id": "INT", "name": "TEXT" } }'
        aria-label="Schema JSON definition"
      />
      {error ? (
        <div className="text-sm text-dracula-red mt-2" role="alert">
          {error}
        </div>
      ) : schema.trim() ? (
        <p className="text-xs text-dracula-comment mt-2">
          Schema applied. Column references will now be validated against the
          provided definition.
        </p>
      ) : (
        <p className="text-xs text-dracula-comment mt-2">
          Example: {"{ \"sales\": { \"id\": \"INT\", \"amount\": \"DECIMAL\" } }"}
        </p>
      )}
    </section>
  );
};

export { SchemaSection };
