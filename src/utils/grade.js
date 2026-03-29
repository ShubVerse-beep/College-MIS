const gradeScale = [
  { min: 90, grade: "A+" },
  { min: 80, grade: "A" },
  { min: 70, grade: "B+" },
  { min: 60, grade: "B" },
  { min: 50, grade: "C" },
  { min: 40, grade: "D" },
  { min: 0, grade: "F" }
];

const calculateGrade = (percentage) => {
  const match = gradeScale.find((item) => percentage >= item.min);
  return match ? match.grade : "F";
};

module.exports = {
  gradeScale,
  calculateGrade
};

