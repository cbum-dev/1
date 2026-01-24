import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from './page'

vi.mock('@/components/homepage', () => ({ default: () => <div>Homepage Component</div> }))
vi.mock('@/components/infinite-scroll', () => ({ InfiniteSliderText: () => <div>Infinite Scroll Component</div> }))
vi.mock('@/components/header', () => ({ default: () => <div>Header Component</div> }))
vi.mock('@/components/landing/features-section', () => ({ default: () => <div>Features Component</div> }))
vi.mock('@/components/landing/pricing-section', () => ({ default: () => <div>Pricing Component</div> }))
vi.mock('@/components/landing/footer', () => ({ default: () => <div>Footer Component</div> }))
vi.mock('@/components/landing/cta-section', () => ({ default: () => <div>CTA Component</div> }))
vi.mock('@/components/landing/hero-image', () => ({ default: () => <div>Hero Image Component</div> }))

test('Page renders correctly', () => {
    render(<Page />)
    expect(screen.getByText('Homepage Component')).toBeDefined()
    expect(screen.getByText('Header Component')).toBeDefined()
})
