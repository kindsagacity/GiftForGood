export const transformFilterParam = value => {
  return value ? value.split(',').map(item => item.trim().toLowerCase()) : value;
};
