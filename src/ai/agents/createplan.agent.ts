import { getGroqClient } from "../../config/groq.js";
import { CRATE_PLAN } from "../prompt/createplan.prompt.js";

const groq = getGroqClient();

async function createPlanAgent(subject: string, duration: string, isGithubUse: boolean, experience: string, language: string, planguage: string, dsa: boolean, aptitude: boolean, interview: boolean, projects: boolean, company: string = "any", companyInterviewInsights: string = "any") {

    const github = isGithubUse ? "can" : "can't"
    const usermessage = `My subject is ${subject} and i need duration ${duration} you ${github} use my github reepo and i have ${experience} experience and i want to prepare for ${company} company and i want to prepare for ${companyInterviewInsights} company interview insights and i want to prepare for ${language} language and i want to prepare for ${planguage} programming language and i want to prepare for ${dsa} dsa and i want to prepare for ${aptitude} aptitude and i want to prepare for ${interview} interview and i want to prepare for ${projects} projects `


    const chatResponse = await groq.chat.completions.create(
        {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: CRATE_PLAN
                },
                {
                    role: "user",
                    content: usermessage
                }
            ],
            response_format: { type: "json_object" }
        }
    )

    const response = chatResponse?.choices[0]?.message.content;

    console.log(response)

    return response;

}

export {
    createPlanAgent
}