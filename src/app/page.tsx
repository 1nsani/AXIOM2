"use client";

import { useState } from "react";
import ProblemInput from "@/components/ProblemInput";
import IdeaSchemaForm from "@/components/IdeaSchemaForm";
import { IdeaSchema, FullSubmission } from "@/lib/types";

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
}

const emptyIdeaSchema: IdeaSchema = {
  blok1: [
    {
      id: generateId(),
      deskripsi: "",
      kerangka: "",
    },
  ],
  blok2: [
    {
      id: generateId(),
      hukum: "",
      kategori: "",
    },
  ],
  blok3: "",
  blok4: {
    targetVariabel: "",
    totalPersamaan: 0,
    batasKondisi: "",
  },
};

export default function Home() {
  const [problemText, setProblemText] = useState("");
  const [problemImageBase64, setProblemImageBase64] = useState<string | null>(null);
  const [ideaSchema, setIdeaSchema] = useState<IdeaSchema>(emptyIdeaSchema);

  const handleKirimIde = () => {
    const fullSubmission: FullSubmission = {
      problemText,
      problemImageBase64,
      ideaSchema,
    };
    console.log(JSON.stringify(fullSubmission, null, 2));
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <ProblemInput
          problemText={problemText}
          onChangeText={setProblemText}
          problemImageBase64={problemImageBase64}
          onChangeImage={setProblemImageBase64}
        />
        <IdeaSchemaForm
          ideaSchema={ideaSchema}
          onChangeSchema={setIdeaSchema}
          onSubmit={handleKirimIde}
        />
      </div>
    </main>
  );
}
