function validateCourseId(courseId, res) {
  if (
    !courseId ||
    courseId === "undefined" ||
    courseId === "null" ||
    typeof courseId !== "string" ||
    !courseId.trim()
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid courseId — subject not loaded yet",
    });
    return false;
  }
  return true;
}

module.exports = { validateCourseId };
