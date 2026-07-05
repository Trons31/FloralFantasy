export const productFlowerInclude = {
  include: {
    flower: {
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        description: true,
        imageUrl: true,
        createdAt: true,
      },
    },
  },
} as const;