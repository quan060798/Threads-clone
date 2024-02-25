import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecoilRoot } from 'recoil' // Import RecoilRoot
import LoginCard from './LoginCard';



describe('LoginCard', () => {
    it('renders correctly', () => {
        render(
            <RecoilRoot>
                <LoginCard />
            </RecoilRoot>
            
        );
        screen.debug();
        expect(screen.getByText('Username')).toBeInTheDocument();
    });
});