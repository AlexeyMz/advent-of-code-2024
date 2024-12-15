pub struct Grid<T> {
    data: Vec<T>,
    rows: i32,
    columns: i32,
}

impl<T> Grid<T> {
    pub fn rows(&self) -> i32 {
        self.rows
    }

    pub fn columns(&self) -> i32 {
        self.columns
    }
}

impl<T: Clone> Grid<T> {
    pub fn new(rows: i32, columns: i32, filler: T) -> Grid<T> {
        let size: usize = (rows * columns).try_into().unwrap();
        Grid {
            data: vec![filler; size],
            rows,
            columns,
        }
    }

    pub fn map<U: Clone>(&self, mapper: impl FnMut(&T) -> U) -> Grid<U> {
        Grid {
            data: self.data.iter().map(mapper).collect(),
            rows: self.rows,
            columns: self.columns,
        }
    }

    pub fn valid(&self, row: i32, column: i32) -> bool {
        row >= 0 && row < self.rows &&
        column >= 0 && column <= self.columns
    }

    pub fn get(&self, row: i32, column: i32) -> Option<T> {
        if self.valid(row, column) {
            let index: usize = (row * self.columns + column).try_into().unwrap();
            Some(self.data[index].clone())
        } else {
            None
        }
    }

    pub fn set(&mut self, row: i32, column: i32, value: T) {
        if !self.try_set(row, column, value) {
            panic!("Grid: trying to set out of bounds")
        }
    }

    pub fn try_set(&mut self, row: i32, column: i32, value: T) -> bool {
        if self.valid(row, column) {
            let index: usize = (row * self.columns + column).try_into().unwrap();
            self.data[index] = value;
            return true;
        } else {
            return false;
        }
    }

    pub fn fill(&mut self, value: T) {
        for i in 0..self.data.len() {
            self.data[i] = value.clone();
        }
    }
}

impl<T: Clone + Default> Grid<T> {
    pub fn empty(rows: i32, columns: i32) -> Grid<T> {
        Grid::new(rows, columns, T::default())
    }
}

impl<T: Clone> Clone for Grid<T> {
    fn clone(&self) -> Grid<T> {
        Grid {
            data: self.data.clone(),
            rows: self.rows,
            columns: self.columns,
        }
    }
}

impl<T: Clone + PartialEq> Grid<T> {
    pub fn find(&self, value: &T) -> Option<(i32, i32)> {
        for i in 0..self.rows {
            for j in 0..self.columns {
                if self.get(i, j).unwrap() == *value {
                    return Some((i, j));
                }
            }
        }
        return None;
    }
}

impl Grid<char> {
    pub fn from_lines(lines: &[String]) -> Grid<char> {
        let rows = lines.len();
        let columns = if lines.is_empty() { 0 } else { lines[0].len() };
        let mut data = vec!['\0'; rows * columns];
        let mut offset: usize = 0;
        for line in lines {
            if line.len() != columns {
                panic!("Grid: inconsistent line length");
            }
            for ch in line.chars() {
                data[offset] = ch;
                offset += 1;
            }
        }
        return Grid {
            data,
            rows: rows.try_into().unwrap(),
            columns: columns.try_into().unwrap(),
        };
    }

    pub fn lines<'a>(&'a self) -> impl Iterator<Item = String> + 'a {
        let chunk_size = self.columns.try_into().unwrap();
        self.data.chunks(chunk_size)
            .map(|line| line.into_iter().collect::<String>() + "\n")
    }
}
