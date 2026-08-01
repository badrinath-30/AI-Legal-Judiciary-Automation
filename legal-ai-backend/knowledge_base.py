# knowledge_base.py
# This is your "library" of legal documents.
# RAG will search through these to find the most relevant one(s)
# for a given question, before sending it to Groq.

LEGAL_DOCUMENTS = [
    {
        "title": "FIR - First Information Report",
        "content": (
            "An FIR (First Information Report) is a written document prepared by "
            "police when they receive information about a cognizable offence. "
            "It is filed under Section 154 of CrPC. Anyone can file an FIR - the "
            "victim, a witness, or any person with knowledge of the crime. Once "
            "filed, the police are legally required to register it and begin "
            "investigation. If police refuse to register an FIR, the complainant "
            "can approach the Superintendent of Police or file a complaint before "
            "a Magistrate under Section 156(3) CrPC."
        ),
    },
    {
        "title": "Bail - Types and Process",
        "content": (
            "Bail is the temporary release of an accused person awaiting trial, "
            "usually on condition that a sum of money is lodged to guarantee "
            "their appearance in court. There are three main types: Regular Bail "
            "(granted after arrest), Anticipatory Bail (granted before arrest, "
            "under Section 438 CrPC, when a person fears arrest for a "
            "non-bailable offence), and Interim Bail (temporary bail granted for "
            "a short period while a regular/anticipatory bail application is "
            "pending). Bail is a matter of right in bailable offences, and "
            "discretionary in non-bailable offences."
        ),
    },
    {
        "title": "Civil Case vs Criminal Case",
        "content": (
            "A civil case involves disputes between individuals or organizations, "
            "such as property disputes, contract breaches, divorce, or recovery "
            "of money. The remedy is usually compensation or a court order, not "
            "punishment. A criminal case involves an offence against the state or "
            "society, such as theft, assault, or murder, and is prosecuted by the "
            "state. Punishment can include fines, imprisonment, or both. The "
            "burden of proof also differs - civil cases use 'preponderance of "
            "evidence', while criminal cases require proof 'beyond reasonable "
            "doubt'."
        ),
    },
    {
        "title": "Indian Penal Code (IPC) Overview",
        "content": (
            "The Indian Penal Code (IPC) is the main criminal code of India, "
            "originally enacted in 1860, covering offences and their punishments. "
            "Key sections include: Section 302 (punishment for murder - life "
            "imprisonment or death penalty), Section 376 (punishment for rape), "
            "Section 420 (cheating and dishonestly inducing delivery of "
            "property), and Section 498A (cruelty by husband or relatives). "
            "Note: As of July 2024, the IPC has been replaced by the Bharatiya "
            "Nyaya Sanhita (BNS) in India, though older cases may still "
            "reference IPC sections."
        ),
    },
    {
        "title": "CrPC Section 154 - Registration of FIR",
        "content": (
            "Section 154 of the Code of Criminal Procedure (CrPC) deals with "
            "the registration of First Information Reports for cognizable "
            "offences. It mandates that police must record information about a "
            "cognizable offence given orally or in writing, read it back to the "
            "informant, and have it signed. A copy must be given to the "
            "informant free of cost. Refusal to register an FIR for a "
            "cognizable offence is a violation of this section and can be "
            "challenged in higher forums."
        ),
    },
    {
        "title": "Article 21 - Right to Life and Personal Liberty",
        "content": (
            "Article 21 of the Indian Constitution states: 'No person shall be "
            "deprived of his life or personal liberty except according to "
            "procedure established by law.' Over the years, Indian courts have "
            "interpreted this to include the right to live with dignity, right "
            "to privacy, right to a speedy trial, right to legal aid, and right "
            "to a clean environment. It is one of the most expansively "
            "interpreted fundamental rights in Indian constitutional law."
        ),
    },
    {
        "title": "Role of an Advocate/Lawyer",
        "content": (
            "An advocate (lawyer) is a person legally qualified and licensed to "
            "practice law, advise clients on legal matters, and represent them "
            "in court. In India, advocates are regulated by the Bar Council of "
            "India under the Advocates Act, 1961. Advocates can specialize in "
            "areas like criminal law, civil law, family law, corporate law, or "
            "property law. Every accused person has a constitutional right to "
            "be defended by a lawyer of their choice, and free legal aid is "
            "available for those who cannot afford one."
        ),
    },
    {
        "title": "Structure of Indian Courts",
        "content": (
            "India's court system is structured hierarchically: District Courts "
            "(handle civil and criminal cases at the district level), High "
            "Courts (one for each state or group of states, handle appeals and "
            "have original jurisdiction in some matters), and the Supreme Court "
            "of India (the highest court, based in New Delhi, hears appeals from "
            "High Courts and has the final say on constitutional matters). Below "
            "District Courts are subordinate courts like Magistrate Courts for "
            "minor offences."
        ),
    },
    {
        "title": "How to File a Case in Court",
        "content": (
            "To file a case in court, a person (plaintiff/complainant) must "
            "first consult an advocate to draft a petition or plaint stating "
            "the facts and relief sought. This is filed in the appropriate "
            "court based on jurisdiction (location and subject matter). Court "
            "fees must be paid, and supporting documents/evidence attached. "
            "The court then issues notice to the other party (defendant/"
            "accused), and the case proceeds through hearings, evidence "
            "submission, arguments, and finally judgment."
        ),
    },
]