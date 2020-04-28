export const GetUserQuery = field => {
  return `
    SELECT * FROM (
        SELECT id, "fullName", ${field}, 'employer' as type FROM employer
        UNION
        SELECT id, "firstName"||' '||"lastName" as "fullName", ${field}, 'creator' as type FROM creator
        UNION
        SELECT id, "firstName"||' '||"lastName" as "fullName", ${field}, 'staff' as type FROM staff
      ) AS dataset WHERE lower(${field}) = $1
  `;
};

export const GetUserByIdQuery = (field, type?) => {
  return `
    SELECT * FROM (
        SELECT id, password, "socialAccount", 'employer' as type FROM employer
        UNION
        SELECT id, password, "socialAccount", 'creator' as type FROM creator
        UNION
        SELECT id, password, false as "socialAccount", 'staff' as type FROM staff
      ) AS dataset WHERE id = $1 ${type ? 'AND type = $2' : ''}
  `;
};
