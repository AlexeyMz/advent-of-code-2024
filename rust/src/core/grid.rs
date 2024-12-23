pub struct Grid<T> {
    data: Vec<T>,
    width: i32,
    height: i32,
}

impl<T> Grid<T> {
    pub fn width(&self) -> i32 {
        self.width
    }

    pub fn height(&self) -> i32 {
        self.height
    }
}

impl<T: Clone> Grid<T> {
    pub fn new(width: i32, height: i32, filler: T) -> Grid<T> {
        let size: usize = (width * height).try_into().unwrap();
        Grid {
            data: vec![filler; size],
            width,
            height,
        }
    }

    pub fn from<const WIDTH: usize, const HEIGHT: usize>(data: [[T; WIDTH]; HEIGHT]) -> Grid<T> {
        Grid {
            data: data.into_iter().flatten().collect(),
            width: WIDTH.try_into().unwrap(),
            height: HEIGHT.try_into().unwrap(),
        }
    }

    pub fn map<U: Clone>(&self, mapper: impl FnMut(&T) -> U) -> Grid<U> {
        Grid {
            data: self.data.iter().map(mapper).collect(),
            width: self.width,
            height: self.height,
        }
    }

    pub fn valid(&self, (x, y): (i32, i32)) -> bool {
        x >= 0 && x < self.width &&
        y >= 0 && y < self.height
    }

    pub fn get(&self, at: (i32, i32)) -> Option<T> {
        if self.valid(at) {
            let index: usize = (at.1 * self.width + at.0).try_into().unwrap();
            Some(self.data[index].clone())
        } else {
            None
        }
    }

    pub fn set(&mut self, at: (i32, i32), value: T) {
        if !self.try_set(at, value) {
            panic!("Grid: trying to set out of bounds")
        }
    }

    pub fn try_set(&mut self, at: (i32, i32), value: T) -> bool {
        if self.valid(at) {
            let index: usize = (at.1 * self.width + at.0).try_into().unwrap();
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
            width: self.width,
            height: self.height,
        }
    }
}

impl<T: Clone + PartialEq> Grid<T> {
    pub fn find(&self, value: &T) -> Option<(i32, i32)> {
        for i in 0..self.width {
            for j in 0..self.height {
                let at = (i, j);
                if self.get(at).unwrap() == *value {
                    return Some(at);
                }
            }
        }
        return None;
    }
}

impl Grid<char> {
    pub fn from_lines(lines: &[String]) -> Result<Grid<char>, String> {
        let height = lines.len();
        let width = if lines.is_empty() { 0 } else { lines[0].len() };
        let mut data = vec!['\0'; width * height];
        let mut offset: usize = 0;
        for line in lines {
            if line.len() != width {
                Err("Grid: inconsistent line length")?;
            }
            for ch in line.chars() {
                data[offset] = ch;
                offset += 1;
            }
        }
        return Ok(Grid {
            data,
            width: width.try_into().unwrap(),
            height: height.try_into().unwrap(),
        });
    }

    pub fn lines<'a>(&'a self) -> impl Iterator<Item = String> + 'a {
        let chunk_size = self.width.try_into().unwrap();
        self.data.chunks(chunk_size)
            .map(|line| line.into_iter().collect::<String>() + "\n")
    }
}
