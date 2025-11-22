import { JUDGE0_URL } from "../constants.js";
import Question from "../models/questionSchema.js";
import { createSubmission } from "./submissionContollers.js";

export const runCode = async (req, res) => {
  // console.log(req.body);
  const { source_code, language, stdin, queId } = req.body;

  // console.log({ source_code, language_id, queId });
  if (!source_code || !language || !queId) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const question = await Question.findById(queId);

  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }
  //TODO:fetch the question and the test cases from DB using queId

  const results = [];
  if (question) {
    for (const test of question.testCases) {
      if (!test.isPrivate) {
        try {
          // Send code to Judge0
          // console.log("hereee")
          const response = await fetch(
            `${JUDGE0_URL}?base64_encoded=false&wait=true`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                source_code,
                language_id: language?.judge,
                stdin: test.input,
              }),
            }
          );

          const data = await response.json();

          const compileErr = data.compile_output?.trim();
          const runtimeErr = data.stderr?.trim();

          const actualOutput = (data.stdout || "").trim();
          const expectedOutput = (test.expected || "").trim();

          let passed = false;
          let errorMessage = null;

          if (compileErr) {
            errorMessage = compileErr;
          } else if (runtimeErr) {
            errorMessage = runtimeErr;
          } else if (data.status?.id !== 3) {
            // status id 3 = accepted

            errorMessage = data.status?.description || "Unknown Error";
          } else {
            passed = actualOutput === expectedOutput;
          }

          // console.log(data);
          results.push({
            input: test.input,
            expected: expectedOutput,
            actual: actualOutput,
            passed,
            error: errorMessage,
            status: data.status.description,
            time: data.time,
            isPrivate: test.isPrivate,
          });
          if (errorMessage) {
            break;
          }
          // console.log(data);
        } catch (error) {
          results.push({
            input: test.input,
            expected: test.expected,
            actual: "",
            passed: false,
            error: error.response?.data || error.message,
            status: "Execution Failed",
          });
        }
      }
    }
    // console.log(results);
  }
  res.json(results);
};
// export const submitCode = async (req, res) => {
//   // console.log(req.body);
//   const { source_code, language, queId, userId, qScore } = req.body;
//   // console.log(language);
//   // res.json()
//   // console.log({ source_code, language, queId });
//   if (!source_code || !language || !queId || !userId || !qScore) {
//     return res.status(400).json({ error: "Missing required fields." });
//   }

//   const question = await Question.findById(queId);

//   if (!question) {
//     return res.status(404).json({ message: "Question not found" });
//   }
//   //TODO:fetch the question and the test cases from DB using queId

//   const results = [];
//   let runtime = 0;
//   let memory = 0;
//   let status = { isPassed: true, verdict: "Accepted" };
//   if (question) {
//     for (const test of question.testCases) {
//       try {
//         // Send code to Judge0
//         // console.log("hereee")
//         const response = await axios.post(
//           `${JUDGE0_URL}?base64_encoded=false&wait=true`,
//           {
//             source_code,
//             language_id: language?.judge,
//             stdin: test.input,
//           },
//           { headers: { "Content-Type": "application/json" } }
//         );

//         const data = response.data;
//         const compileErr = data.compile_output?.trim();
//         const runtimeErr = data.stderr?.trim();

//         const actualOutput = (data.stdout || "").trim();
//         const expectedOutput = (test.expected || "").trim();

//         let passed = false;
//         let errorMessage = null;

//         if (compileErr) {
//           status.isPassed = false;
//           status.verdict = "Compilation Error";
//           errorMessage = compileErr;
//         } else if (runtimeErr) {
//           status.isPassed = false;
//           status.verdict = "Runtime Error";
//           errorMessage = runtimeErr;
//         } else if (data.status?.id !== 3) {

//           status.isPassed = false;
//           status.verdict = "Unknown Error";
//           errorMessage = data.status?.description || "Unknown Error";
//         } else {
//           passed = actualOutput === expectedOutput;
//         }

//         if(!passed) {
//           status.verdict = "Wrong Answer"
//           status.isPassed=false
//         }

//         runtime += Number(data.time || 0);
//         memory = Math.max(memory, Number(data.memory || 0));
//         // console.log(data);
//         results.push({
//           input: test.input,
//           expected: expectedOutput,
//           actual: actualOutput,
//           passed,
//           error: errorMessage,
//           status: data.status.description,
//           time: data.time,
//           isPrivate: test.isPrivate,
//         });
//         if (errorMessage) {
//           break;
//         }
//         // console.log(data);
//       } catch (error) {
//         results.push({
//           input: test.input,
//           expected: test.expected,
//           actual: "",
//           passed: false,
//           error: error.response?.data || error.message,
//           status: "Execution Failed",
//         });
//         status = { isPassed: false, verdict: "runtime error" };
//       }
//     }
//     // console.log(results);
//   }
// console.log(status);
//   // await createSubmission({
//   //   userId,
//   //   questionId: queId,
//   //   language,
//   //   runtime,
//   //   memory,
//   //   status,
//   //   source_code,
//   //   score: status ? qScore : 0,
//   // });
//   // console.log({
//   //   userId,
//   //   queId,
//   //   language,
//   //   runtime,
//   //   memory,
//   //   status,
//   //   source_code,
//   // });
//   res.json(results);
// };

export const submitCode = async (req, res) => {
  const { source_code, language, queId, userId, qScore } = req.body;

  if (!source_code || !language || !queId || !userId || !qScore) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const question = await Question.findById(queId);
  if (!question) return res.status(404).json({ message: "Question not found" });

  const results = [];
  let runtime = 0;
  let memory = 0;

  let status = {
    isPassed: true,
    verdict: "Accepted",
  };

  for (const test of question.testCases) {
    try {
      const response = await fetch(
        `${JUDGE0_URL}?base64_encoded=false&wait=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_code,
            language_id: language?.judge,
            stdin: test.input,
          }),
        }
      );

      const data = await response.json();
;

      const compileErr = data.compile_output?.trim();
      const runtimeErr = data.stderr?.trim();

      const actualOutput = (data.stdout || "").trim();
      const expectedOutput = (test.expected || "").trim();

      let passed = actualOutput === expectedOutput;
      let errorMessage = null;

      // --- HANDLE ERRORS ---
      if (compileErr) {
        status.isPassed = false;
        status.verdict = "Compilation Error";
        errorMessage = compileErr;
      } else if (runtimeErr) {
        status.isPassed = false;
        status.verdict = "Runtime Error";
        errorMessage = runtimeErr;
      } else if (data.status?.id === 5) {
        // TLE (judge0)
        status.isPassed = false;
        status.verdict = "Time Limit Exceeded";
        errorMessage = "Time Limit Exceeded";
      } else if (data.status?.id !== 3) {
        status.isPassed = false;
        status.verdict = "Unknown Error";
        errorMessage = data.status?.description || "Unknown Error";
      } else if (!passed) {
        status.isPassed = false;
        status.verdict = "Wrong Answer";
      }

      runtime += Number(data.time || 0);
      memory = Math.max(memory, Number(data.memory || 0));

      results.push({
        input: test.input,
        expected: expectedOutput,
        actual: actualOutput,
        passed,
        error: errorMessage,
        status: data.status?.description,
        time: data.time,
        isPrivate: test.isPrivate,
      });

      // Stop on any failure
      if (!passed || errorMessage) break;
    } catch (err) {
      status.isPassed = false;
      status.verdict = "Runtime Error";

      results.push({
        input: test.input,
        expected: test.expected,
        actual: "",
        passed: false,
        error: err.message,
        status: "Execution Failed",
      });

      break;
    }
  }

  // Save to DB
  // console.log(status);
  await createSubmission({
    userId,
    questionId: queId,
    language,
    runtime,
    memory,
    status,
    source_code,
    score: status ? qScore : 0,
  });

  return res.json({ results , status});
};

export const getAllQuestions = async (req, res) => {
  try {
    // console.log("herrrr");
    const questions = await Question.find({}, "QueTitle difficultyLevel");
    // console.log(questions);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};


export const getQuestionById = async (req, res) => {
  // console.log("hitttttttt");
  try {
    const id = req.params.id;
    // console.log(id);
    const question = await Question.findById(id);
    // console.log("whereee??? ", question);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    return res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error,
    });
  }
};

export const addQuestion = async (req, res) => {
  try {
    // console.log(req.body);

    const q = new Question(req.body);
    await q.save();
    res.json({ message: "Added!", q });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
